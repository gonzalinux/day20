FROM oven/bun:debian AS builder

WORKDIR /app

COPY . .

RUN bun install

RUN bun build --compile --minify --sourcemap --bytecode ./index.ts --outfile day20backend

FROM gcr.io/distroless/cc-debian12

WORKDIR /app

COPY --from=builder /app/day20backend ./day20backend


USER nonroot:nonroot

ENTRYPOINT ["/app/day20backend"]
