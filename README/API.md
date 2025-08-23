# Contrato de Preferências de Tema

Este documento descreve um contrato preliminar para a sincronização de preferências de tema dos usuários.

## Endpoints

### `GET /users/{id}/preferences/theme`
Retorna a preferência de tema do usuário.

#### Resposta
```json
{ "theme": "dark" }
```

### `PUT /users/{id}/preferences/theme`
Atualiza a preferência de tema do usuário.

#### Corpo da requisição
```json
{ "theme": "light" }
```

#### Resposta
Código 204 sem corpo.

## Valores aceitos
- `light`: tema claro
- `dark`: tema escuro
- `system`: acompanha o tema do sistema

Este contrato é apenas uma proposta e poderá ser alterado conforme a implementação evoluir.

