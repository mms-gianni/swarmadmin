const debug = require('debug')('superlocust:watcher');
const kubectl = require('./kubectl');
const axios = require('axios');

function loadStats(status) {
    for (let i in status.instances) {
        let instance = status.instances[i];
        let name = instance.name;
        console.log(name);

        if (instance.status.master.readyReplicas > 0) {
            axios.get(`http://${instance.ingressHost}:7081/stats/requests`).then(function(response) {
                //let stats = response.data;
                console.log("load data");
                //console.log(response.data);
                status.instances[name].stats = response.data;
            }).catch(function(error) {
                //console.log(error);
                console.log("load data error");
            });
        }
    }
}

async function watcher(status) {
    const namespace = process.env.NAMESPACE || 'default';
    await kubectl.list(namespace).then(function(data) {
        data.deployments.body.items.forEach(element => {
            //console.log(element.status);
            // Load data status master
            if (element.metadata.name.endsWith('-master')) {
                let MasterName = element.metadata.name.replace("-master", "")
                status.instances[MasterName].status.master.replicas = element.status.replicas;
                status.instances[MasterName].status.master.unavailableReplicas = element.status.unavailableReplicas || 0;
                status.instances[MasterName].status.master.readyReplicas = element.status.readyReplicas || 0;
            }
            // Load data status worker
            if (element.metadata.name.endsWith('-worker')) {

                let workerName = element.metadata.name.replace("-worker", "")
                status.instances[workerName].status.worker.replicas = element.status.replicas;
                status.instances[workerName].status.worker.unavailableReplicas = element.status.unavailableReplicas || 0;
                status.instances[workerName].status.worker.readyReplicas = element.status.readyReplicas || 0;
            }
        });
    }).catch(function(err) {
        debug(err);
    });
    loadStats(status);
    //console.log(status);
    console.log("pull run");
    debug(status);
}

module.exports = watcher;
