from pydantic import BaseModel, field_validator

VALID_THEMES = {'roxo','vermelho','azul','verde','laranja','cinza','rosa','ciano'}
VALID_MODES = {'light','dark'}

class ThemePreferences(BaseModel):
    themeName: str
    themeMode: str

    @field_validator('themeName')
    def validate_theme(cls, v):
        if v not in VALID_THEMES:
            raise ValueError('invalid theme')
        return v

    @field_validator('themeMode')
    def validate_mode(cls, v):
        if v not in VALID_MODES:
            raise ValueError('invalid mode')
        return v
