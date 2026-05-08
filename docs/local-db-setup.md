# CareerLens 로컬 DB 설정 가이드

## 1. 결론

CareerLens 백엔드는 Spring Data JPA + Hibernate를 사용한다.

따라서 팀원이 직접 테이블을 하나하나 만들 필요는 없다.

필요한 것은 다음 두 가지다.

```txt
1. 로컬 DB에 careerlens 데이터베이스 생성
2. IntelliJ 또는 OS 환경변수로 DB 접속 정보 설정
```

테이블은 백엔드 실행 시 `ddl-auto=update` 설정에 따라 JPA 엔티티 기준으로 자동 생성된다.

## 2. 공통 원칙

현재 프로젝트는 MySQL과 MariaDB를 모두 지원한다.

기본값은 MySQL이다.
MariaDB를 사용하는 팀원은 환경변수로 DB 설정을 덮어쓴다.

설정 파일:

```txt
backend/src/main/resources/application.yml
```

현재 설정:

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:mysql://localhost:3306/careerlens?serverTimezone=Asia/Seoul&characterEncoding=UTF-8}
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:1234}
    driver-class-name: ${DB_DRIVER:com.mysql.cj.jdbc.Driver}
  jpa:
    hibernate:
      ddl-auto: ${DB_DDL_AUTO:update}
```

## 3. DB 생성

MySQL 또는 MariaDB에서 아래 DB를 먼저 생성한다.

```sql
CREATE DATABASE careerlens DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

DB 자체는 자동 생성되지 않는다.
DB 안의 테이블만 JPA가 자동 생성한다.

## 4. MySQL 사용 팀원

기본값 그대로 사용해도 된다.

기본값:

```txt
DB_URL=jdbc:mysql://localhost:3306/careerlens?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
DB_USERNAME=root
DB_PASSWORD=1234
DB_DRIVER=com.mysql.cj.jdbc.Driver
DB_DDL_AUTO=update
```

비밀번호가 다르면 IntelliJ 환경변수에 `DB_PASSWORD`만 넣어도 된다.

## 5. MariaDB 사용 팀원

IntelliJ 실행 설정의 Environment variables에 아래 값을 넣는다.

```env
DB_URL=jdbc:mariadb://localhost:3306/careerlens?useUnicode=true&characterEncoding=utf8
DB_USERNAME=root
DB_PASSWORD=본인_MariaDB_비밀번호
DB_DRIVER=org.mariadb.jdbc.Driver
DB_DDL_AUTO=update
```

MariaDB 포트나 계정이 다르면 각자 환경에 맞게 수정한다.

## 6. IntelliJ 설정 위치

```txt
Run
-> Edit Configurations
-> Spring Boot 실행 설정 선택
-> Environment variables
```

예시:

```txt
DB_URL=jdbc:mariadb://localhost:3306/careerlens?useUnicode=true&characterEncoding=utf8;DB_USERNAME=root;DB_PASSWORD=1234;DB_DRIVER=org.mariadb.jdbc.Driver;DB_DDL_AUTO=update
```

IntelliJ에서는 환경변수 항목을 `;`로 구분해서 입력한다.

## 7. PowerShell 임시 실행

MySQL:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/careerlens?serverTimezone=Asia/Seoul&characterEncoding=UTF-8"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="1234"
$env:DB_DRIVER="com.mysql.cj.jdbc.Driver"
$env:DB_DDL_AUTO="update"
```

MariaDB:

```powershell
$env:DB_URL="jdbc:mariadb://localhost:3306/careerlens?useUnicode=true&characterEncoding=utf8"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="1234"
$env:DB_DRIVER="org.mariadb.jdbc.Driver"
$env:DB_DDL_AUTO="update"
```

그 다음 백엔드를 실행한다.

```powershell
cd backend
mvn spring-boot:run
```

## 8. 테이블이 안 생길 때 확인할 것

```txt
1. careerlens DB 자체가 생성되어 있는가?
2. DB 계정에 CREATE TABLE 권한이 있는가?
3. DB_URL이 mysql/mariadb에 맞게 되어 있는가?
4. DB_DRIVER가 URL과 맞는가?
5. DB_DDL_AUTO가 update 또는 create인지 확인했는가?
6. application.yml이 아니라 다른 profile 설정이 실행되고 있지 않은가?
7. 백엔드 실행 로그에 Access denied, Unknown database, Communications link failure가 없는가?
```

## 9. 자주 나는 오류

### Unknown database 'careerlens'

DB 자체가 없다.

```sql
CREATE DATABASE careerlens DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Access denied for user

계정 또는 비밀번호가 틀렸거나 권한이 없다.

### No suitable driver

`DB_DRIVER`와 JDBC URL이 맞지 않는다.

MySQL:

```txt
DB_DRIVER=com.mysql.cj.jdbc.Driver
DB_URL=jdbc:mysql://...
```

MariaDB:

```txt
DB_DRIVER=org.mariadb.jdbc.Driver
DB_URL=jdbc:mariadb://...
```

### 테이블이 안 생김

`DB_DDL_AUTO`가 `none` 또는 `validate`로 되어 있으면 자동 생성되지 않는다.

개발 환경에서는:

```txt
DB_DDL_AUTO=update
```

## 10. 팀 공지용 요약

```txt
DB는 각자 MySQL/MariaDB 중 편한 것을 사용해도 됩니다.
단, careerlens DB는 직접 생성해야 합니다.
테이블은 백엔드 실행 시 JPA가 자동 생성합니다.
MariaDB 사용자는 IntelliJ 환경변수에 DB_URL, DB_DRIVER, DB_PASSWORD를 반드시 설정해주세요.
```
