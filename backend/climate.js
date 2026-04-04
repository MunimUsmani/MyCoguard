const express = require("express")
const axios = require("axios")

const router = express.Router()

router.post("/projection", async (req,res)=>{

    try{

        const {lat,lng} = req.body

        const response = await axios.get(

            "https://climate-api.open-meteo.com/v1/climate",

            {
                params:{
                    latitude:lat,
                    longitude:lng,

                    start_year:2025,
                    end_year:2050,

                    models:"CMCC_CM2_VHR4",

                    daily:"temperature_2m_mean,precipitation_sum"
                }
            }

        )

        res.json({

            location:{
                lat,
                lng
            },

            temperature_trend:
            response.data.daily.temperature_2m_mean.slice(0,30),

            precipitation_trend:
            response.data.daily.precipitation_sum.slice(0,30)

        })

    }

    catch(error){

        res.status(500).json({

            error:"climate api failed",

            details:error.message
        })

    }

})

module.exports = router