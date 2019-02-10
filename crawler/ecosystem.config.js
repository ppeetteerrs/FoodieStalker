module.exports = {
  apps : [{
    name: 'foodie_crawler',
    script: 'dist/run.js',
    args: '-u explodingbelly sgfoodsteps foodfilterxx yinagoh libbyatsg foodiepink modgam blancheeze aspirantsg teojimmy msskinnyfat',
    instances: 1,
    autorestart: false,
    watch: false,
    max_memory_restart: '3G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
