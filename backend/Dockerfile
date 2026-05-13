FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace

COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src

RUN mvn -f backend/pom.xml -DskipTests package

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S careerlens && adduser -S careerlens -G careerlens

COPY --from=build /workspace/backend/target/*.jar /app/app.jar
COPY seed-data /app/seed-data

ENV SERVER_PORT=8080
ENV CAREERLENS_SEED_PATH=/app/seed-data/recommendation-seed.json
ENV CAREERLENS_SEED_PROCESSED_PATH=/app/seed-data/processed

EXPOSE 8080

USER careerlens

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
