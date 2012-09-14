<?php sleep(rand(0, 4)); ?>
<?php $id=$_REQUEST['id']; ?>
define(['bar/bar-define.php?id=<?php echo $id; ?>&r=<?php echo rand(); ?>'], function(exports){
  return 'foo-<?php echo $id; ?>#' + exports;
});
