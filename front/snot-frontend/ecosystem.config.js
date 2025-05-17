module.exports = {
  apps: [{
    name: "snot-frontend",
    script: "npm",
    args: "start",
    cwd: "/home/ec2-user/projects/my-react-app/SNOT/front/snot-frontend",
    env: {
      "NODE_ENV": "development",
      "PORT": "3000"
    },
    watch: false,
