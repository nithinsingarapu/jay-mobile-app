from typing import Annotated
from fastapi import APIRouter, Depends, BackgroundTasks, Query
from fastapi.responses import Response
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session_factory
from app.auth import AuthenticatedUser
from app.shared.exceptions import NotFoundError
from .models import ProductResearch
from .schemas import ResearchRequest, ResearchOut, ResearchStatusOut

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.post("", response_model=ResearchStatusOut, status_code=202)
async def start_research(
    data: ResearchRequest,
    user: AuthenticatedUser,
    db: DbSession,
    background_tasks: BackgroundTasks,
):
    """Start a new product research. Runs in background, poll /research/{id} for status."""
    # Check if we already have a completed report for this product
    stmt = select(ProductResearch).where(
        ProductResearch.product_name.ilike(f"%{data.product_name}%"),
        ProductResearch.status == "completed",
    ).order_by(desc(ProductResearch.created_at)).limit(1)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        return existing

    # Create pending record
    research = ProductResearch(
        product_name=data.product_name,
        product_id=data.product_id,
        status="pending",
    )
    db.add(research)
    await db.commit()
    await db.refresh(research)

    # Run pipeline in background
    research_id = research.id
    background_tasks.add_task(_run_pipeline_bg, research_id, data.product_name, data.product_id)

    return research


@router.get("", response_model=list[ResearchStatusOut])
async def list_research(
    user: AuthenticatedUser,
    db: DbSession,
    limit: int = Query(20, ge=1, le=50),
):
    """List recent research reports."""
    stmt = select(ProductResearch).order_by(desc(ProductResearch.created_at)).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{research_id}", response_model=ResearchOut)
async def get_research(research_id: int, user: AuthenticatedUser, db: DbSession):
    """Get a research report by ID (poll for status)."""
    result = await db.execute(select(ProductResearch).where(ProductResearch.id == research_id))
    research = result.scalar_one_or_none()
    if not research:
        raise NotFoundError("Research", research_id)
    return research


@router.get("/{research_id}/pdf")
async def download_pdf(research_id: int, db: DbSession):
    """Download the research report as a PDF."""
    result = await db.execute(select(ProductResearch).where(ProductResearch.id == research_id))
    research = result.scalar_one_or_none()
    if not research:
        raise NotFoundError("Research", research_id)
    if research.status != "completed" or not research.report_markdown:
        return Response(content="Report not ready", status_code=400)

    from .pdf_export import markdown_to_pdf
    pdf_bytes = markdown_to_pdf(research.report_markdown, research.product_name)

    safe_name = research.product_name.replace(" ", "_").replace("/", "-")[:50]
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="JAY_Research_{safe_name}.pdf"'},
    )


@router.get("/product/{product_id}", response_model=ResearchOut | None)
async def get_research_by_product(product_id: int, db: DbSession):
    """Get cached research for a product ID."""
    stmt = select(ProductResearch).where(
        ProductResearch.product_id == product_id,
        ProductResearch.status == "completed",
    ).order_by(desc(ProductResearch.created_at)).limit(1)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _run_pipeline_bg(research_id: int, product_name: str, product_id: int | None):
    """Background task to run the research pipeline."""
    from .pipeline import run_research
    async with async_session_factory() as db:
        # Enrich product name with brand from our DB if we have a product_id
        full_name = product_name
        if product_id:
            from app.features.products.models import Product
            prod = await db.execute(select(Product).where(Product.id == product_id))
            product = prod.scalar_one_or_none()
            if product:
                brand = product.brand or ""
                name = product.name or product_name
                # Ensure brand is included in the name for Gemini
                if brand and brand.lower() not in name.lower():
                    full_name = f"{brand} {name}"
                else:
                    full_name = name

        # Update status + enriched name
        result = await db.execute(select(ProductResearch).where(ProductResearch.id == research_id))
        research = result.scalar_one_or_none()
        if not research:
            return
        research.status = "running"
        research.product_name = full_name
        await db.commit()

        await run_research(full_name, product_id, db)
