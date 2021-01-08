# Args to be injected
# dns_name: FDQN de la ip por la que se accede a la máquina
# username: nombre del usuario principal de la máquina

# Install docker for Ubuntu 18.04
sudo apt update
sudo apt-get install -y  \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
sudo apt update
sudo apt-get -y install docker-ce docker-ce-cli containerd.io

# Install rancher with letsencrypt

sudo docker run -d --restart=unless-stopped -p 80:80 -p 443:443 --privileged rancher/rancher:latest --acme-domain $dns_name