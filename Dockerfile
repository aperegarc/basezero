# Stage 1: Build frontend
FROM node:20 AS frontend-builder
WORKDIR /app/frontend

# Copiamos solo package.json y package-lock.json para cache de dependencias
COPY basezero-frontend/package*.json ./
RUN npm install

# Copiamos el resto del frontend y construimos
COPY basezero-frontend/ ./
RUN npm run build

# Stage 2: Build backend con Maven
FROM maven:3.9.9-eclipse-temurin-17 AS backend-builder
WORKDIR /app/backend

# Copiamos todo el backend
COPY basezero/ ./

# Aseguramos que mvnw sea ejecutable
RUN chmod +x mvnw

# Copiamos el build del frontend dentro del backend
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static

# Compilamos el backend (omitimos tests para acelerar)
RUN ./mvnw clean package -DskipTests

# Stage 3: Imagen final
FROM eclipse-temurin:17-jdk
WORKDIR /app

# Copiamos el .jar compilado
COPY --from=backend-builder /app/backend/target/*.jar app.jar

# Exponemos el puerto de Spring Boot
EXPOSE 8080

# Comando de inicio
CMD ["java", "-jar", "app.jar"]