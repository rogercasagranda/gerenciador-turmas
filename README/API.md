# Preferências de Tema

Esta API permite sincronizar o tema visual do usuário entre dispositivos.

## Endpoints

### `GET /me/preferences/theme`
Retorna a preferência de tema do usuário autenticado.

#### Resposta
```json
{ "themeName": "roxo", "themeMode": "light" }
```

### `PUT /me/preferences/theme`
Atualiza a preferência de tema do usuário autenticado.

#### Corpo da requisição
```json
{ "themeName": "azul", "themeMode": "dark" }
```

#### Resposta
`204 No Content`

#### Erros
- `400 Bad Request` – valores de tema inválidos

## Valores permitidos
- **themeName**: `roxo`, `azul`, `verde`, `laranja`, `cinza`, `teal`, `ciano`, `rosa`, `violeta`, `ambar`
- **themeMode**: `light`, `dark`
