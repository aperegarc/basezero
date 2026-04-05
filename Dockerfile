# Stage 1: build
FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /app

# Copiamos solo los archivos del backend
COPY basezero/basezero/mvnw .
COPY basezero/basezero/.mvn .mvn/
COPY basezero/basezero/pom.xml .
COPY basezero/basezero/src ./src

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

# Stage 2: runtime
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

CMD ["java", "-jar", "app.jar"]