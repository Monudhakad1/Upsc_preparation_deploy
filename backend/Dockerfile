# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Dependencies first so they are cached across source-only changes.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q package -DskipTests \
 && cp target/backend-*.jar target/app.jar

# ---- Runtime stage (JRE only, alpine = small image) ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

# Unpack into app.jar + lib/ (Spring Boot "tools" layout) - required for CDS and
# also starts faster than running the fat jar directly.
COPY --from=build /app/target/app.jar /tmp/app.jar
RUN java -Djarmode=tools -jar /tmp/app.jar extract --destination /app/extracted \
 && rm /tmp/app.jar

# CDS training run: boots the Spring context once (no DB needed) and dumps the
# loaded classes to app.jsa. Every real start then maps that archive instead of
# re-parsing thousands of classes - noticeably faster cold starts on Render.
RUN APP_JWT_SECRET=cds-training-only-secret-cds-training-only-secret \
    SEED_MENTOR_EMAIL=x SEED_MENTOR_PASSWORD=x SEED_ASPIRANT_EMAIL=y SEED_ASPIRANT_PASSWORD=y \
    java -XX:ArchiveClassesAtExit=/app/extracted/app.jsa -Dspring.context.exit=onRefresh \
      -Dspring.flyway.enabled=false \
      -Dspring.jpa.hibernate.ddl-auto=none \
      -Dspring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect \
      -Dspring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false \
      -jar /app/extracted/app.jar \
 && chown -R app:app /app

USER app
EXPOSE 8080

# Small-container tuning (Render free tier = 512MB, shared CPU):
#  - heap sized from the container limit, SerialGC = lowest footprint
#  - TieredStopAtLevel=1 = C1 JIT only: much less CPU spent compiling during boot
#  - SharedArchiveFile = use the CDS archive built above
ENV JPA_DDL_AUTO=none \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1 -XX:SharedArchiveFile=/app/extracted/app.jsa -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/extracted/app.jar"]
