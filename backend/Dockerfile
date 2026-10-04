FROM amazonlinux:2023 AS builder

RUN dnf install -y gcc gcc-c++ make pkgconfig openssl-devel perl git tar xz \
    && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations

RUN cargo build --release && strip target/release/sentinelmesh-backend
