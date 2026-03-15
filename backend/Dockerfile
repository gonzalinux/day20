FROM oven/bun:1.3.8-debian AS builder

WORKDIR /app

COPY . .

RUN bun install

RUN bun build --compile --minify --sourcemap --bytecode ./index.ts --outfile day20backend

FROM gcr.io/distroless/cc-debian12:nonroot

WORKDIR /app

COPY --from=builder /app/day20backend ./day20backend


USER nonroot:nonroot

ENTRYPOINT ["/app/day20backend"]
