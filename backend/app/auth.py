from authlib.integrations.starlette_client import OAuth
from .config import settings

oauth = OAuth()

# 仅在配置了凭据时注册，避免空凭据导致启动报错
if settings.google_configured:
    oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
