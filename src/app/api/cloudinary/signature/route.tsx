import { apiKey } from 'better-auth/plugins';
import {v2 as cloudinary} from 'cloudinary'
import { error } from 'console';
import { NextResponse } from 'next/server';


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


export async function POST(request : Request){
    try {
        const {timestamp} = await request.json();
        const signature = cloudinary.utils.api_sign_request({
            timestamp,
            folder: 'next-gallery-app-manager'
        },
        process.env.CLOUDINARY_API_SECRET as string
    );
    return NextResponse.json({
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY,
    })
    } catch (e) {
        console.log('Error while generating cloudinary signature');
        return NextResponse.json({
            error: 'Failed To generate signature'
        },{status:500})
    }
}