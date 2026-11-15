# Recipe to pack the backend (Spring Boot) into a Docker "box".
# Step 1: build the program with Maven + Java 21 (this step is thrown away afterwards)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

# Step 2: a small box with only Java (no Maven) + the finished program
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
# Uploaded photos are saved here (a Docker "volume" keeps them safe when the box is replaced)
RUN mkdir -p /app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
