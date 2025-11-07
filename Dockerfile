# ---------------------------------------------------
#  Stage 1: Builder - build Next.js app
# ---------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

#  Declare all build args
ARG MONGODB_URI
ARG RESEND_API_KEY
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG JWT_SECRET
ARG NEXT_PUBLIC_BACKEND_API_URL
ARG NEXT_PUBLIC_BASE_URL

#  Export them as environment variables
ENV MONGODB_URI=${MONGODB_URI}
ENV RESEND_API_KEY=${RESEND_API_KEY}
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
ENV JWT_SECRET=${JWT_SECRET}
ENV NEXT_PUBLIC_BACKEND_API_URL=${NEXT_PUBLIC_BACKEND_API_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

#  Build your app
RUN npm run build

# ---------------------------------------------------
#  Stage 2: Runner - serve the built app
# ---------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
