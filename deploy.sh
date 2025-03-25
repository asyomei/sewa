echo '===> Create tar.gz'
tar -czf dist.tar.gz -C dist .

echo '===> Deploy'
curl sewa.asyomei.org/deploy/sewa \
  -F name="$NAME" -F dist=@dist.tar.gz -F outpath="$OUTPATH"
