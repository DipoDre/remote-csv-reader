const express = require('express')
const http = require('https')
const path = require('path')
const fs = require('fs')
const csv = require('csvtojson');
const nano = require('nanoid')
const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/', (req, res) => {
    
    let csvUrl = req.body.csv.url
    let csvFields = req.body.csv["select_fields"]

    if (csvFields === undefined || csvFields.length === 0) {
        csvFields = null;
    }

    const urlOptions = new URL(csvUrl);

    let urlPathname = (urlOptions.pathname);

    let urlExtension = path.extname(urlPathname);

    if (urlExtension !== ".csv") {
        res.json({Message : 'The URL might not have a valid CSV file'});
    }

    else {
        let csvRequest = http.request(urlOptions, (response) => {
            
            if (response.statusCode !== 200) {
                res.json({Message : "Invalid URL ${response.statusCode}"});
                }
    
            else if (response.headers["content-type"] !== "text/csv") {
                res.json({Messgae: "Invalid content-type. Content has to be a CSV"});
            }
    
            else {
                let body = "";
                response.setEncoding("utf-8");
                response.on('data', chunk => { body += chunk; })
    
                response.on("end", () => {
                    console.log(response.headers["content-type"])

                    fs.writeFileSync('intermediate.csv', body)

                    csv()
                        .fromFile('intermediate.csv')
                        .then((jsonObj)=>{
                            let text = JSON.stringify(jsonObj, csvFields);
                            res.json({conversion_key : nano.nanoid(), json : JSON.parse(text)})
                        })

                })
                    
            }       
    
        });
    
        csvRequest.on('error', (e) => {
            console.error(e);
            if (e.code === 'ENOTFOUND') {
                res.json({Message: 'The domain that you are trying to reach is unavailable or wrong'})
            }
            else if (e.code === 'ETIMEDOUT') {
                res.json({Message: 'The connection timed out. Try again.'})
            }
            
        });
        
        csvRequest.end();
    }

})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

