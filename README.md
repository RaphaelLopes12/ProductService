# Product Service

Um microsserviço para gerenciamento de produtos utilizando **Node.js** com **NestJS** e **TypeORM**, fornecendo funcionalidades como criação, edição, exclusão, listagem com filtros e paginação, e suporte a upload de imagens diretamente para o S3 da AWS.

## Funcionalidades

- **Criação de Produtos:** Permite criar produtos com informações como nome, descrição, preço, quantidade em estoque, SKU, EAN, categoria, entre outros.
- **Upload de Imagens:** Suporte para upload de imagens no formato Base64, com armazenamento no S3 e armazenamento do link no banco de dados.
- **Listagem de Produtos:** Retorna a lista de produtos com suporte a filtros dinâmicos (nome, categoria, família) e paginação.
- **Detalhes de Produtos:** Retorna as informações detalhadas de um produto com base no seu ID.
- **Atualização de Produtos:** Permite atualizar os dados de um produto, incluindo a substituição da imagem.
- **Exclusão de Produtos:** Remove produtos do banco de dados.
- **Autenticação JWT:** Proteção dos endpoints com autenticação baseada em tokens JWT.

## Tecnologias Utilizadas

- **Node.js**
- **NestJS**
- **TypeORM**
- **PostgreSQL**
- **AWS S3**
- **JWT (JSON Web Tokens)**
- **ESLint e Prettier**

## Requisitos

- **Node.js**: v16+
- **npm** ou **yarn**
- **PostgreSQL**
- **Credenciais AWS (S3)**

## Configuração e Instalação

1. Clone o repositório:

   ```bash
   git clone <url-do-repositorio>
   cd product-service

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:

   Crie um arquivo `.env` na raiz do projeto com as seguintes configurações:

  ```env
  PORT=4000
  JWT_SECRET=sua-key-aqui
  DB_HOST=<seu-host>
  DB_PORT=5432
  DB_USERNAME=<seu-usuario>
  DB_PASSWORD=<sua-senha>
  DB_NAME=product_service
  AWS_ACCESS_KEY_ID=<sua-aws-key>
  AWS_SECRET_ACCESS_KEY=<sua-aws-secret>
  AWS_REGION=<sua-aws-region>
  AWS_BUCKET_NAME=<seu-bucket-s3>
  ```

4. Inicialize o banco de dados:

   Certifique-se de que o banco de dados PostgreSQL está configurado e rodando. O TypeORM criará as tabelas automaticamente ao iniciar a aplicação.

5. Inicie o servidor:

   ```bash
   npm run start
   ```

   O serviço estará disponível em `http://localhost:4000`.

## Endpoints

### **Produtos**

#### Criar Produto
- **POST /products**
  - Cria um novo produto com dados completos, incluindo imagem no formato Base64.
  - Payload:
    ```json
    {
      "name": "Smartphone XYZ",
      "description": "Smartphone de última geração",
      "price": 1999.99,
      "stockQuantity": 50,
      "sku": "SPH-XYZ-128",
      "ean": "7891234567891",
      "family": "Eletrônicos",
      "category": "Smartphones",
      "base64Image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/egPk6YAAAAASUVORK5CYII="
    }
    ```
    - Respostas:
      - **Sucesso**:
        ```json
        {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "name": "Smartphone XYZ",
          "imageUrl": "https://bucket-name.s3.amazonaws.com/products/unique-id.png",
          "createdAt": "2025-01-01T12:00:00.000Z"
        }
      ```
#### Listar Produtos com Filtros e Paginação
- **GET /products**
  - Lista produtos com suporte a filtros e paginação.
  - Parâmetros:
    - page (opcional): Página atual. Padrão: 1.
    - limit (opcional): Limite de itens por página. Padrão: 10.
    - name (opcional): Filtro pelo nome do produto.
    - category (opcional): Filtro pela categoria.
    - family (opcional): Filtro pela família.
  - Exemplo de URL:

    ```bash
    GET /products?page=2&limit=5&name=Smartphone&category=Smartphones
    ```

  - Respostas:
      ```json
        {
          "data": [
            {
              "id": "123e4567-e89b-12d3-a456-426614174000",
              "name": "Smartphone XYZ",
              "price": 1999.99,
              "category": "Smartphones"
            }
          ],
          "total": 50,
          "page": 2,
          "lastPage": 5
        }
      ```

#### Detalhes de Produto
- **GET /products/:id**
  - Retorna as informações completas de um produto pelo seu ID.

#### Atualizar Produto
- **PATCH /products/:id**
  - Atualiza os dados de um produto. Pode incluir a substituição da imagem.

#### Excluir Produto
- **DELETE /products/:id**
  - Remove um produto do banco de dados.

## Testes

1. Execute os testes unitários:

   ```bash
   npm run test
   ```

2. Execute os testes de integração:

   ```bash
   npm run test:e2e
   ```

3. Verifique a cobertura de testes:

   ```bash
   npm run test:cov
   ```

## Observação sobre o AWS S3

O upload de imagens é feito diretamente para o S3 usando as credenciais fornecidas. Certifique-se de configurar as permissões adequadas no bucket S3 para permitir acesso público ou use URLs assinadas para maior segurança.

## Licença

Este projeto está sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais informações.


