var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var cors = require("cors");
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import Files
const authenticate = require('./routes/authenticate');
const users = require('./routes/users');
const CIData = require('./routes/CIData');
const cDdata = require('./routes/cDdata');
const envConstants = require('./utils/envConstants')


var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist/DevopsDashboardAngular')));
app.use('/', express.static(path.join(__dirname, 'dist/DevopsDashboardAngular')));

app.use(cors())

module.exports = app;

app.use('/api/authenticate', authenticate);

app.use(function(req, res, next) {

    // Verify the token
    if(req.headers.authorization) {
        var cert = fs.readFileSync('./certificates/public.pem');
        jwt.verify(req.headers.authorization.split(' ')[1], cert, { algorithms: ['RS256'] }, function(err, decoded) {
            if(!err &&
                Math.floor(Date.now() / 1000) < decoded.iat &&
                Math.floor(Date.now() / 1000) < decoded.exp) {
                next()
            } else {
                res.status(200).send({status: 401, message: "Unauthorized!", response: {}})
            }
        });
    } else {
        res.status(200).send({status: 401, message: "Unauthorized!", response: {}})
    }
})

app.use('/api/CiData', CIData);
app.use('/api/cDdata', cDdata);
// app.use('/api/users', users);
app.get('/api/validateSession', function(req, res) {
    res.status(200).send({status: 200, message: "Success", response: {}})
})

// get the AppNames
app.get('/api/getApps', function (req, res) {
    var apps = [];

    getAppList(function (err, data) {
        if (err) {
            console.log("error" + err);
            res.status(500).send({status: 500, message: err, response: {}})
        }
        else {
            console.log("data" + data);
            var appNames = data.value;
            appNames.forEach(element => {
                apps.push({
                    "name": element.name
                })
            });
            res.status(200).send({status: 200, message: "Success", response: apps})
        }
    });
});



//getting appNames
function getAppList(cb) {
    var options = {
        uri: envConstants.AZURE_DASHBOARD_BASE_URL + "_apis/projects?api-version=5.0",
        method: "GET",
        headers: {
            'Accept': "application/json",
            'Authorization': envConstants.AZURE_DASHBOARD_TOKEN
        },
        json: true,
        body: {}
    };
    request(options, function (err, res, body) {
        if (err) {
            console.error(err);
            cb(err, {});
        } else {
            console.log("body" + JSON.stringify(body));
            cb(null, body);
        }
    });

}

//getting Projects for Specific App
app.get("/api/getAppProjectList", function (req, res) {
    var projectNames = [];
    var UniqueprojectNames = [];
    var selectedAppName = req.query.selectedAppName
    getAppProjectList(selectedAppName, function (err, data) {
        if (err) {
            console.log("error" + err);
            res.status(500).send({status: 500, message: err, response: {}})
        }
        else {
            console.log("data" + data);
            var appProjectList = data.value;
            appProjectList.forEach(element => {
                if (projectNames.indexOf(element.path.split('\\')[1]) == -1)
                    projectNames.push(element.path.split('\\')[1])
            });
            projectNames.forEach(element => {
                UniqueprojectNames.push({
                    "name": element
                })
            })
            res.status(200).send({status: 200, message: "Success", response: UniqueprojectNames})
        }
    });
})

function getAppProjectList(appName, cb) {
    var options = {
        uri: envConstants.AZURE_DASHBOARD_BASE_URL + appName + "/_apis/work/teamsettings/iterations",
        method: "GET",
        headers: {
            'Accept': "application/json",
            'Authorization': envConstants.AZURE_DASHBOARD_TOKEN
        },
        json: true,
        body: {}
    };
    request(options, function (err, res, body) {
        if (err) {
            console.error(err);
            cb(err, {});
        } else {
            console.log("body" + JSON.stringify(body));
            cb(null, body);
        }
    });

}



//get Sprint list for Specific Project(iteration)

app.get("/api/getProjectSprintList", function (req, res) {
    var SprintNames = [];
    var appName = req.query.appName;
    var selectedProjectName = req.query.project
    getProjectSprintList(appName, function (err, data) {
        if (err) {
            console.log("error" + err);
            res.status(500).send({status: 500, message: err, response: {}})
        }
        else {
            console.log("data" + data);
            var appProjectList = data.value;
            appProjectList.forEach(element => {

                if (element.path.split('\\')[1] == selectedProjectName) {
                    if (element.path.split('\\')[2]) {
                        SprintNames.push({
                            "id": element.id,
                            "name": element.path.split('\\')[2],
                            "startdate": element.attributes.startDate,
                            "enddate": element.attributes.finishDate,
                        })
                    }
                }
            })
            res.status(200).send({status: 200, message: "Success", response: SprintNames})
        }
    });
})

function getProjectSprintList(appName, cb) {
    var options = {
        uri: envConstants.AZURE_DASHBOARD_BASE_URL + appName + "/_apis/work/teamsettings/iterations",
        method: "GET",
        headers: {
            'Accept': "application/json",
            'Authorization': envConstants.AZURE_DASHBOARD_TOKEN
        },
        json: true,
        body: {}
    };
    request(options, function (err, res, body) {
        if (err) {
            console.error(err);
            cb(err, {});
        } else {
            console.log("body" + JSON.stringify(body));
            cb(null, body);
        }
    });

}

//get WorkItem List for Specific Sprint ID

app.get("/api/getSprintWorkItemList", function (req, res) {
    var appName = req.query.appName;
    var selectedSprintId = req.query.sprintId;
    var workItemIds = [];
    var storynewstate = 0;
    var storyactivestate = 0;
    var storyclosedstate = 0;
    var defectnewstate = 0;
    var defectactivestate = 0;
    var defectclosedstate = 0;
    var workItemDetails = [];
    var workItemTagscount = {};

    getSprintWorkItemList(appName, selectedSprintId, function (err, data) {
        if (err) {
            console.error("getSprintWorkItemList:", err);
            workItemDetails.push({
                "storynewstate": 0,
                "storyclosedstate": 0,
                "storyactivestate": 0,
                "totalstories": 0,
                "defectnewstate": 0,
                "defectclosedstate": 0,
                "defectactivestate": 0,
                "totaldefects": 0,
                "workItemTags": 0
            })
            res.status(200).send({status: 200, message: "Success", response: workItemDetails})
        }
        else {
            // console.log("getSprintWorkItemList resp:", data);
            workItemIds = data;
            if (data && data.length == 1 && data[0] == "no workitem found") {
                // No Sprints/Workitem available
                workItemDetails.push({
                    "storynewstate": 0,
                    "storyclosedstate": 0,
                    "storyactivestate": 0,
                    "totalstories": 0,
                    "defectnewstate": 0,
                    "defectclosedstate": 0,
                    "defectactivestate": 0,
                    "totaldefects": 0,
                    "workItemTags": 0
                })
                res.status(200).send({status: 200, message: "Success", response: workItemDetails})
            } else {
                getSprintWorkItemDetails(appName, workItemIds.toString(), (err, resp) => {
                    if (err) {
                        console.error("getSprintWorkItemList - getSprintWorkItemDetails:", err)
                        workItemDetails.push({
                            "storynewstate": 0,
                            "storyclosedstate": 0,
                            "storyactivestate": 0,
                            "totalstories": 0,
                            "defectnewstate": 0,
                            "defectclosedstate": 0,
                            "defectactivestate": 0,
                            "totaldefects": 0,
                            "workItemTags": 0
                        })
                        res.status(200).send({status: 200, message: "Success", response: workItemDetails})
                    } else {
                        // console.log("getSprintWorkItemList - getSprintWorkItemDetails resp:", resp)

                        if (resp && resp.value && resp.value.length > 0) {
                            resp.value.forEach(element => {

                                // User Story
                                if (element.fields["System.WorkItemType"] == "User Story" ||
                                		element.fields["System.WorkItemType"] == "Product Backlog Item") {

                                    // User Story Tags
                                    if (element.fields["System.Tags"] && !workItemTagscount[element.fields["System.Tags"]])
                                        workItemTagscount[element.fields["System.Tags"].toUpperCase()] = 1
                                    else if (element.fields["System.Tags"])
                                        workItemTagscount[element.fields["System.Tags"].toUpperCase()] += 1

                                    // User Story Status
                                    if (element.fields["System.State"] == "New")
                                        storynewstate++;
                                    else if (element.fields["System.State"] == "Active")
                                        storyactivestate++;
                                    else
                                        storyclosedstate++;
                                }

                                // Defect Status
                                else if (element.fields["System.WorkItemType"] == "Bug") {
                                    if (element.fields["System.State"] == "New")
                                        defectnewstate++;
                                    else if (element.fields["System.State"] == "Active")
                                        defectactivestate++;
                                    else
                                        defectclosedstate++;
                                }
                            })

                            workItemDetails.push({
                                "storynewstate": storynewstate,
                                "storyclosedstate": storyclosedstate,
                                "storyactivestate": storyactivestate,
                                "totalstories": storynewstate + storyclosedstate + storyactivestate,
                                "defectnewstate": defectnewstate,
                                "defectclosedstate": defectclosedstate,
                                "defectactivestate": defectactivestate,
                                "totaldefects": defectnewstate + defectclosedstate + defectactivestate,
                                "workItemTags": workItemTagscount

                            })
                            // console.log("workItemDetails:", workItemDetails)
                            res.status(200).send({status: 200, message: "Success", response: workItemDetails})

                        } else {
                            // No Workitem Details available
                            workItemDetails.push({
                                "storynewstate": 0,
                                "storyclosedstate": 0,
                                "storyactivestate": 0,
                                "totalstories": 0,
                                "defectnewstate": 0,
                                "defectclosedstate": 0,
                                "defectactivestate": 0,
                                "totaldefects": 0,
                                "workItemTags": 0
                            })
                            res.status(200).send({status: 200, message: "Success", response: workItemDetails})
                        }
                    }
                })
            }
        }
    });
})

//Get workitem ID's
function getSprintWorkItemList(appName, selectedSprintId, cb) {
    var options = {
        uri: envConstants.AZURE_DASHBOARD_BASE_URL + appName + "/_apis/work/teamsettings/iterations/" + selectedSprintId + "/workitems",
        method: "GET",
        headers: {
            'Accept': "application/json",
            'Authorization': envConstants.AZURE_DASHBOARD_TOKEN
        },
        json: true,
        body: {}
    };
    request(options, function (err, res, body) {
        if (err) {
            console.error(err);
            cb(err, {});
        } else {
            var WorkItemIds = [];
            console.log("body" + JSON.stringify(body));
            var workItems = body.workItemRelations
            if (workItems && workItems.length >= 0) {
                workItems.forEach(element => {
                    WorkItemIds.push(element.target.id)
                })
            }
            else {
                WorkItemIds.push("no workitem found")
            }
            cb(null, WorkItemIds);
        }
    });

}


//Get WorkItem Details with count of Story and defects

function getSprintWorkItemDetails(appName, WorkItemIds, cb) {
    console.log("WorkItemIds in get function" + WorkItemIds);
    var options = {
        uri: envConstants.AZURE_DASHBOARD_BASE_URL + appName + "/_apis/wit/workitems?ids=" + WorkItemIds,
        method: "GET",
        headers: {
            'Accept': "application/json",
            'Authorization': envConstants.AZURE_DASHBOARD_TOKEN
        },
        json: true,
        body: {}
    };
    request(options, function (err, res, body) {
        if (err) {
            console.error(err);
            cb(err, {});
        } else {

            console.log("body" + JSON.stringify(body));
            cb(null, body);
        }
    });

}
app.listen(4200);


