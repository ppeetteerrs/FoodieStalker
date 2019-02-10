module.exports = {
    apps : [{
        name: "foodie_rethinkdb",
        script: "./launch_rethink.sh"
    },{
      name: 'foodie_server',
      script: 'dist/server.js',
      autorestart: true,
      env: {
        PROD: true
      }
    }]
  };
  