from fastapi import FastAPI

app = FastAPI()  # Instância da aplicação FastAPI

@app.get("/")
def read_root():
    return {"message": "Hello World"}
