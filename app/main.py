from fastapi import FastAPI

app = FastAPI()  # <=== ESSA LINHA É OBRIGATÓRIA

@app.get("/")
def read_root():
    return {"message": "Hello World"}