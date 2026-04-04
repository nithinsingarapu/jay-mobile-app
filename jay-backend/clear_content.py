"""One-time script: clear all content tables and verify."""
import asyncio
from sqlalchemy import text
from app.database import async_session_factory

async def clear():
    async with async_session_factory() as db:
        for table in ['content_tips', 'content_myths', 'content_articles', 'content_concerns', 'content_ingredients']:
            result = await db.execute(text(f"DELETE FROM {table}"))
            print(f"  Deleted {result.rowcount} rows from {table}")
        await db.commit()
    print("\nAll content tables cleared. Ready for fresh batch.")

asyncio.run(clear())
