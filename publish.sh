#!/bin/sh

aws s3 sync --delete --region us-west-2 --cache-control max-age=604800 dist s3://mesh.robrohan.com
