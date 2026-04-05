# Stage 1: Build frontend
FROM node:20 AS frontend-builder
WORKDIR /app/frontend
COPY basezero-frontend/package*.json ./
RUN npm install
COPY basezero-frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM maven:3.9.9-eclipse-temurin-21 AS backend-builder
WORKDIR /app/backend
COPY basezero/basezero/ ./
RUN chmod +x mvnw
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static
RUN ./mvnw clean package -DskipTests

# Stage 3: Runtime
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend-builder /app/backend/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]