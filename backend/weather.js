const express = require("express")
const axios = require("axios")

const router = express.Router()

router.post("/forecast", async (req,res)=>{

    try{

        const {lat,lng} = req.body

        const response = await axios.get(

            "https://api.openweathermap.org/data/2.5/forecast",

            {
                params:{
                    lat:lat,
                    lon:lng,
                    appid:process.env.OPENWEATHER_API_KEY,
                    units:"metric"
                }
            }

        )

        let rainTotal = 0

        response.data.list.forEach(item=>{

            if(item.rain?.["3h"]){

                rainTotal += item.rain["3h"]

            }

        })

        res.json({

            location:response.data.city.name,

            rain_5day_mm:rainTotal,

            risk:

            rainTotal>40?"HIGH":

            rainTotal>20?"MEDIUM":

            "LOW"

        })

    }

    catch(err){

        res.status(500).json({

            error:"weather failed"

        })

    }

})

module.exports = router