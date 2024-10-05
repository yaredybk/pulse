const express = require('express');
const app = express();

app.get('/', (rq, rs) => {
  rs.send(`<h1>PULSE</h1>
    <p>this is a chat application</p>`);
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`server listenning on port:${process.env.PORT || 5000}`);
});
