FROM nginx:stable-alpine

# Copy site content into nginx html root
COPY . /usr/share/nginx/html:ro

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
