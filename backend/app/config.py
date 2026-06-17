from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # 应用
    secret_key: str = "change-me-in-production"
    base_url: str = "http://localhost:8000"  # OAuth 回调拼接用
    cookie_secure: bool = False

    # 数据库
    database_url: str = "sqlite:///./app.db"

    # 谷歌 OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # 白名单（逗号分隔）
    allowed_emails: str = "yangtianwei600@gmail.com"

    @property
    def allowed_email_set(self) -> set[str]:
        return {e.strip().lower() for e in self.allowed_emails.split(",") if e.strip()}

    @property
    def google_configured(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)


settings = Settings()
