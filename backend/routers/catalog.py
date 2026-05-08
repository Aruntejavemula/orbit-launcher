from fastapi import APIRouter, Request
from typing import List
from pydantic import BaseModel
from limiter import limiter

router = APIRouter()


class CatalogEntry(BaseModel):
    name: str
    slug: str
    color: str
    category: str
    url: str


CATALOG: List[CatalogEntry] = [
    # AI
    CatalogEntry(name="Claude", slug="claude", color="D97757", category="ai", url="https://claude.ai"),
    CatalogEntry(name="ChatGPT", slug="openai", color="10A37F", category="ai", url="https://chat.openai.com"),
    CatalogEntry(name="Perplexity", slug="perplexity", color="20B8CD", category="ai", url="https://perplexity.ai"),
    CatalogEntry(name="Gemini", slug="googlegemini", color="8E75B2", category="ai", url="https://gemini.google.com"),
    CatalogEntry(name="Midjourney", slug="midjourney", color="1A1A1A", category="ai", url="https://midjourney.com"),
    CatalogEntry(name="Cursor", slug="cursor", color="000000", category="ai", url="https://cursor.com"),
    CatalogEntry(name="GitHub Copilot", slug="githubcopilot", color="1F1F1F", category="ai", url="https://github.com/features/copilot"),
    CatalogEntry(name="Mistral", slug="mistralai", color="FA520F", category="ai", url="https://chat.mistral.ai"),
    CatalogEntry(name="Anthropic", slug="anthropic", color="D97757", category="ai", url="https://anthropic.com"),
    CatalogEntry(name="Hugging Face", slug="huggingface", color="FFD21E", category="ai", url="https://huggingface.co"),
    CatalogEntry(name="Replicate", slug="replicate", color="000000", category="ai", url="https://replicate.com"),
    CatalogEntry(name="Runway", slug="runway", color="000000", category="ai", url="https://runwayml.com"),
    CatalogEntry(name="ElevenLabs", slug="elevenlabs", color="000000", category="ai", url="https://elevenlabs.io"),
    CatalogEntry(name="Replit", slug="replit", color="F26207", category="ai", url="https://replit.com"),
    CatalogEntry(name="v0", slug="vercel-v0", color="000000", category="ai", url="https://v0.dev"),
    CatalogEntry(name="Bolt", slug="stackblitz", color="1389FD", category="ai", url="https://bolt.new"),
    CatalogEntry(name="Lovable", slug="lovable", color="FF4F8B", category="ai", url="https://lovable.dev"),
    CatalogEntry(name="Ollama", slug="ollama", color="000000", category="ai", url="https://ollama.com"),
    CatalogEntry(name="Phind", slug="phind", color="00C6FB", category="ai", url="https://phind.com"),
    CatalogEntry(name="DeepL", slug="deepl", color="0F2B46", category="ai", url="https://deepl.com"),
    CatalogEntry(name="Cohere", slug="cohere", color="39594D", category="ai", url="https://cohere.com"),
    CatalogEntry(name="Stable Diffusion", slug="stablediffusion", color="000000", category="ai", url="https://stability.ai"),

    # Design
    CatalogEntry(name="Figma", slug="figma", color="F24E1E", category="design", url="https://figma.com"),
    CatalogEntry(name="Sketch", slug="sketch", color="F7B500", category="design", url="https://sketch.com"),
    CatalogEntry(name="Framer", slug="framer", color="0055FF", category="design", url="https://framer.com"),
    CatalogEntry(name="Photoshop", slug="adobephotoshop", color="31A8FF", category="design", url="https://adobe.com/photoshop"),
    CatalogEntry(name="Illustrator", slug="adobeillustrator", color="FF9A00", category="design", url="https://adobe.com/illustrator"),
    CatalogEntry(name="Adobe XD", slug="adobexd", color="FF61F6", category="design", url="https://adobe.com/xd"),
    CatalogEntry(name="Premiere Pro", slug="adobepremierepro", color="9999FF", category="design", url="https://adobe.com/premiere"),
    CatalogEntry(name="After Effects", slug="adobeaftereffects", color="9999FF", category="design", url="https://adobe.com/aftereffects"),
    CatalogEntry(name="Canva", slug="canva", color="00C4CC", category="design", url="https://canva.com"),
    CatalogEntry(name="Procreate", slug="procreate", color="000000", category="design", url="https://procreate.com"),
    CatalogEntry(name="Affinity", slug="affinity", color="1B72BE", category="design", url="https://affinity.serif.com"),
    CatalogEntry(name="Webflow", slug="webflow", color="146EF5", category="design", url="https://webflow.com"),
    CatalogEntry(name="InVision", slug="invision", color="FF3366", category="design", url="https://invisionapp.com"),
    CatalogEntry(name="Spline", slug="spline", color="000000", category="design", url="https://spline.design"),
    CatalogEntry(name="Penpot", slug="penpot", color="000000", category="design", url="https://penpot.app"),
    CatalogEntry(name="Whimsical", slug="whimsical", color="6B44FF", category="design", url="https://whimsical.com"),
    CatalogEntry(name="Miro", slug="miro", color="FFD02F", category="design", url="https://miro.com"),
    CatalogEntry(name="Excalidraw", slug="excalidraw", color="6965DB", category="design", url="https://excalidraw.com"),
    CatalogEntry(name="Rive", slug="rive", color="000000", category="design", url="https://rive.app"),

    # Productivity
    CatalogEntry(name="Notion", slug="notion", color="000000", category="productivity", url="https://notion.so"),
    CatalogEntry(name="Linear", slug="linear", color="5E6AD2", category="productivity", url="https://linear.app"),
    CatalogEntry(name="Asana", slug="asana", color="F06A6A", category="productivity", url="https://asana.com"),
    CatalogEntry(name="Trello", slug="trello", color="0079BF", category="productivity", url="https://trello.com"),
    CatalogEntry(name="Jira", slug="jira", color="0052CC", category="productivity", url="https://atlassian.com/software/jira"),
    CatalogEntry(name="ClickUp", slug="clickup", color="7B68EE", category="productivity", url="https://clickup.com"),
    CatalogEntry(name="Monday", slug="mondaydotcom", color="FF3D57", category="productivity", url="https://monday.com"),
    CatalogEntry(name="Airtable", slug="airtable", color="18BFFF", category="productivity", url="https://airtable.com"),
    CatalogEntry(name="Coda", slug="coda", color="F46A54", category="productivity", url="https://coda.io"),
    CatalogEntry(name="Todoist", slug="todoist", color="E44332", category="productivity", url="https://todoist.com"),
    CatalogEntry(name="Obsidian", slug="obsidian", color="7C3AED", category="productivity", url="https://obsidian.md"),
    CatalogEntry(name="Microsoft Teams", slug="microsoftteams", color="6264A7", category="productivity", url="https://teams.microsoft.com"),
    CatalogEntry(name="Zoom", slug="zoom", color="0B5CFF", category="productivity", url="https://zoom.us"),
    CatalogEntry(name="Loom", slug="loom", color="625DF5", category="productivity", url="https://loom.com"),
    CatalogEntry(name="Calendly", slug="calendly", color="006BFF", category="productivity", url="https://calendly.com"),
    CatalogEntry(name="Zapier", slug="zapier", color="FF4A00", category="productivity", url="https://zapier.com"),
    CatalogEntry(name="Make", slug="make", color="6D00CC", category="productivity", url="https://make.com"),
    CatalogEntry(name="n8n", slug="n8n", color="EA4B71", category="productivity", url="https://n8n.io"),
    CatalogEntry(name="Google Docs", slug="googledocs", color="4285F4", category="productivity", url="https://docs.google.com"),
    CatalogEntry(name="Google Sheets", slug="googlesheets", color="34A853", category="productivity", url="https://sheets.google.com"),
    CatalogEntry(name="Google Drive", slug="googledrive", color="4285F4", category="productivity", url="https://drive.google.com"),
    CatalogEntry(name="Dropbox", slug="dropbox", color="0061FF", category="productivity", url="https://dropbox.com"),
    CatalogEntry(name="OneDrive", slug="microsoftonedrive", color="0078D4", category="productivity", url="https://onedrive.live.com"),
    CatalogEntry(name="Outlook", slug="microsoftoutlook", color="0078D4", category="productivity", url="https://outlook.live.com"),
    CatalogEntry(name="Word", slug="microsoftword", color="2B579A", category="productivity", url="https://word.cloud.microsoft"),
    CatalogEntry(name="Excel", slug="microsoftexcel", color="217346", category="productivity", url="https://excel.cloud.microsoft"),
    CatalogEntry(name="PowerPoint", slug="microsoftpowerpoint", color="B7472A", category="productivity", url="https://powerpoint.cloud.microsoft"),
    CatalogEntry(name="Slack", slug="slack", color="4A154B", category="productivity", url="https://slack.com"),
    CatalogEntry(name="Discord", slug="discord", color="5865F2", category="productivity", url="https://discord.com"),
    CatalogEntry(name="Telegram", slug="telegram", color="26A5E4", category="productivity", url="https://telegram.org"),
    CatalogEntry(name="WhatsApp", slug="whatsapp", color="25D366", category="productivity", url="https://web.whatsapp.com"),
    CatalogEntry(name="Signal", slug="signal", color="3A76F0", category="productivity", url="https://signal.org"),
    CatalogEntry(name="Gmail", slug="gmail", color="EA4335", category="productivity", url="https://mail.google.com"),
    CatalogEntry(name="GitHub", slug="github", color="181717", category="productivity", url="https://github.com"),
    CatalogEntry(name="GitLab", slug="gitlab", color="FC6D26", category="productivity", url="https://gitlab.com"),
    CatalogEntry(name="Bitbucket", slug="bitbucket", color="0052CC", category="productivity", url="https://bitbucket.org"),
    CatalogEntry(name="VS Code", slug="visualstudiocode", color="007ACC", category="productivity", url="https://vscode.dev"),
    CatalogEntry(name="Sublime Text", slug="sublimetext", color="FF9800", category="productivity", url="https://sublimetext.com"),
    CatalogEntry(name="Warp", slug="warp", color="01A4FF", category="productivity", url="https://warp.dev"),
    CatalogEntry(name="Vercel", slug="vercel", color="000000", category="productivity", url="https://vercel.com"),
    CatalogEntry(name="Netlify", slug="netlify", color="00C7B7", category="productivity", url="https://netlify.com"),
    CatalogEntry(name="Cloudflare", slug="cloudflare", color="F38020", category="productivity", url="https://cloudflare.com"),
    CatalogEntry(name="AWS", slug="amazonwebservices", color="232F3E", category="productivity", url="https://aws.amazon.com"),
    CatalogEntry(name="Heroku", slug="heroku", color="430098", category="productivity", url="https://heroku.com"),
    CatalogEntry(name="Railway", slug="railway", color="0B0D0E", category="productivity", url="https://railway.app"),
    CatalogEntry(name="DigitalOcean", slug="digitalocean", color="0080FF", category="productivity", url="https://digitalocean.com"),
    CatalogEntry(name="CodeSandbox", slug="codesandbox", color="000000", category="productivity", url="https://codesandbox.io"),
    CatalogEntry(name="Postman", slug="postman", color="FF6C37", category="productivity", url="https://postman.com"),
    CatalogEntry(name="Insomnia", slug="insomnia", color="4000BF", category="productivity", url="https://insomnia.rest"),
    CatalogEntry(name="Docker", slug="docker", color="2496ED", category="productivity", url="https://docker.com"),
    CatalogEntry(name="Raycast", slug="raycast", color="FF6363", category="productivity", url="https://raycast.com"),
    CatalogEntry(name="1Password", slug="1password", color="3B66BC", category="productivity", url="https://1password.com"),
    CatalogEntry(name="Bitwarden", slug="bitwarden", color="175DDC", category="productivity", url="https://bitwarden.com"),
    CatalogEntry(name="Arc", slug="arc", color="000000", category="productivity", url="https://arc.net"),
    CatalogEntry(name="Brave", slug="brave", color="FB542B", category="productivity", url="https://brave.com"),
    CatalogEntry(name="Chrome", slug="googlechrome", color="4285F4", category="productivity", url="https://chrome.google.com"),
    CatalogEntry(name="Firefox", slug="firefoxbrowser", color="FF7139", category="productivity", url="https://firefox.com"),

    # Finance
    CatalogEntry(name="Stripe", slug="stripe", color="635BFF", category="finance", url="https://stripe.com"),
    CatalogEntry(name="Wise", slug="wise", color="9FE870", category="finance", url="https://wise.com"),
    CatalogEntry(name="Revolut", slug="revolut", color="000000", category="finance", url="https://revolut.com"),
    CatalogEntry(name="PayPal", slug="paypal", color="003087", category="finance", url="https://paypal.com"),
    CatalogEntry(name="QuickBooks", slug="quickbooks", color="2CA01C", category="finance", url="https://quickbooks.intuit.com"),
    CatalogEntry(name="Xero", slug="xero", color="13B5EA", category="finance", url="https://xero.com"),
    CatalogEntry(name="Mercury", slug="mercury", color="5036ED", category="finance", url="https://mercury.com"),
    CatalogEntry(name="Plaid", slug="plaid", color="000000", category="finance", url="https://plaid.com"),
    CatalogEntry(name="Coinbase", slug="coinbase", color="0052FF", category="finance", url="https://coinbase.com"),
    CatalogEntry(name="Brex", slug="brex", color="000000", category="finance", url="https://brex.com"),

    # Music
    CatalogEntry(name="Spotify", slug="spotify", color="1DB954", category="music", url="https://open.spotify.com"),
    CatalogEntry(name="Apple Music", slug="applemusic", color="FA243C", category="music", url="https://music.apple.com"),
    CatalogEntry(name="YouTube Music", slug="youtubemusic", color="FF0000", category="music", url="https://music.youtube.com"),
    CatalogEntry(name="SoundCloud", slug="soundcloud", color="FF7700", category="music", url="https://soundcloud.com"),
    CatalogEntry(name="Tidal", slug="tidal", color="000000", category="music", url="https://tidal.com"),
    CatalogEntry(name="Audible", slug="audible", color="F8991C", category="music", url="https://audible.com"),
    CatalogEntry(name="Bandcamp", slug="bandcamp", color="408EA3", category="music", url="https://bandcamp.com"),
]


@router.get("", response_model=List[CatalogEntry])
@limiter.limit("30/minute")
async def get_catalog(request: Request):
    return CATALOG
