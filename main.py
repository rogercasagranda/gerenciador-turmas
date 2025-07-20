from fastapi import FastAPI

app = FastAPI()  # <=== ESSA LINHA É OBRIGATÓRIA
#TESTE 
@app.get("/")
def read_root():
    return {"message": "Hello World"}