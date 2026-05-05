from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

router = APIRouter()


class CatalogEntry(BaseModel):
    name: str
    slug: str
    color: str
    category: str
    url: str


# Sourced from frontend/src/data/appCatalog.ts
CATALOG: List[CatalogEntry] = [
    CatalogEntry(name="Claude", slug="claude", color="D97757", category="ai", url="https://claude.ai"),
    CatalogEntry(name="ChatGPT", slug="openai", color="10A37F", category="ai", url="https://chat.openai.com"),
    CatalogEntry(name="Perplexity", slug="perplexity", color="20B8CD", category="ai", url="https://perplexity.ai"),
    CatalogEntry(name="Gemini", slug="googlegemini", color="8E75B2", category="ai", url="https://gemini.google.com"),
    CatalogEntry(name="Midjourney", slug="midjourney", color="1A1A1A", category="ai", url="https://midjourney.com"),
    CatalogEntry(name="Cursor", slug="cursor", color="000000", category="ai", url="https://cursor.com"),
    CatalogEntry(name="GitHub Copilot", slug="githubcopilot", color="1F1F1F", category="ai", url="https://github.com/features/copilot"),
    CatalogEntry(name="Mistral", slug="mistralai", color="FA520F", category="ai", url="https://chat.mistral.ai"),
    CatalogEntry(name="Hugging Face", slug="huggingface", color="FFD21E", category="ai", url="https://huggingface.co"),
    CatalogEntry(name="Replicate", slug="replicate", color="000000", category="ai", url="https://replicate.com"),
    CatalogEntry(name="Runway", slug="runway", color="000000", category="ai", url="https://runwayml.com"),
    CatalogEntry(name="ElevenLabs", slug="elevenlabs", color="000000", category="ai", url="https://elevenlabs.io"),
    CatalogEntry(name="Replit", slug="replit", color="F26207", category="ai", url="https://replit.com"),
    CatalogEntry(name="Figma", slug="figma", color="F24E1E", category="design", url="https://figma.com"),
    CatalogEntry(name="Sketch", slug="sketch", color="F7B500", category="design", url="https://sketch.com"),
    CatalogEntry(name="Framer", slug="framer", color="0055FF", category="design", url="https://framer.com"),
    CatalogEntry(name="Canva", slug="canva", color="00C4CC", category="design", url="https://canva.com"),
    CatalogEntry(name="Webflow", slug="webflow", color="146EF5", category="design", url="https://webflow.com"),
    CatalogEntry(name="Miro", slug="miro", color="FFD02F", category="design", url="https://miro.com"),
    CatalogEntry(name="Notion", slug="notion", color="000000", category="productivity", url="https://notion.so"),
    CatalogEntry(name="Linear", slug="linear", color="5E6AD2", category="productivity", url="https://linear.app"),
    CatalogEntry(name="Asana", slug="asana", color="F06A6A", category="productivity", url="https://asana.com"),
    CatalogEntry(name="Trello", slug="trello", color="0079BF", category="productivity", url="https://trello.com"),
    CatalogEntry(name="Jira", slug="jira", color="0052CC", category="productivity", url="https://atlassian.com/software/jira"),
    CatalogEntry(name="ClickUp", slug="clickup", color="7B68EE", category="productivity", url="https://clickup.com"),
    CatalogEntry(name="Airtable", slug="airtable", color="18BFFF", category="productivity", url="https://airtable.com"),
    CatalogEntry(name="Todoist", slug="todoist", color="E44332", category="productivity", url="https://todoist.com"),
    CatalogEntry(name="Obsidian", slug="obsidian", color="7C3AED", category="productivity", url="https://obsidian.md"),
    CatalogEntry(name="Slack", slug="slack", color="4A154B", category="productivity", url="https://slack.com"),
    CatalogEntry(name="Discord", slug="discord", color="5865F2", category="productivity", url="https://discord.com"),
    CatalogEntry(name="Zoom", slug="zoom", color="0B5CFF", category="productivity", url="https://zoom.us"),
    CatalogEntry(name="Loom", slug="loom", color="625DF5", category="productivity", url="https://loom.com"),
    CatalogEntry(name="Telegram", slug="telegram", color="26A5E4", category="productivity", url="https://telegram.org"),
    CatalogEntry(name="WhatsApp", slug="whatsapp", color="25D366", category="productivity", url="https://web.whatsapp.com"),
    CatalogEntry(name="Gmail", slug="gmail", color="EA4335", category="productivity", url="https://mail.google.com"),
    CatalogEntry(name="GitHub", slug="github", color="181717", category="productivity", url="https://github.com"),
    CatalogEntry(name="GitLab", slug="gitlab", color="FC6D26", category="productivity", url="https://gitlab.com"),
    CatalogEntry(name="VS Code", slug="visualstudiocode", color="007ACC", category="productivity", url="https://vscode.dev"),
    CatalogEntry(name="Vercel", slug="vercel", color="000000", category="productivity", url="https://vercel.com"),
    CatalogEntry(name="Netlify", slug="netlify", color="00C7B7", category="productivity", url="https://netlify.com"),
    CatalogEntry(name="Spotify", slug="spotify", color="1DB954", category="music", url="https://open.spotify.com"),
    CatalogEntry(name="Apple Music", slug="applemusic", color="FC3C44", category="music", url="https://music.apple.com"),
    CatalogEntry(name="Stripe", slug="stripe", color="635BFF", category="finance", url="https://stripe.com"),
    CatalogEntry(name="QuickBooks", slug="quickbooks", color="2CA01C", category="finance", url="https://quickbooks.intuit.com"),
    CatalogEntry(name="Xero", slug="xero", color="13B5EA", category="finance", url="https://xero.com"),
]


@router.get("", response_model=List[CatalogEntry])
def get_catalog():
    return CATALOG
