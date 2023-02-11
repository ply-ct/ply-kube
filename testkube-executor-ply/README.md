
```
docker build -t ply-ct/testkube-executor-ply .

kubectl testkube create executor --image ply-ct/testkube-executor-ply --types ply-ct/test --name ply-executor

kubectl testkube create test --name movie-queries --git-uri https://github.com/ply-ct/ply-demo.git --type ply-ct/test --job-template job.yaml

```
