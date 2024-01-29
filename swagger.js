import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "U-tube API",
    description: "U-tube Api with all functionalities",
  },
  host: "localhost:8000",
};

const outputFile = "./swagger-output.json";
const routes = [
  "./src/routes/user.routes.js",
  "./src/routes/tweet.routes.js",
  "./src/routes/playlist.routes.js",
  "./src/routes/like.routes.js",
  "./src/routes/dashboard.routes.js",
  "./src/routes/comment.routes.js",
  "./src/routes/videos.routes.js",
  "./src/routes/subscription.routes.js",
];

swaggerAutogen(outputFile, routes, doc);
