<?php sleep(rand(0, 1)); ?>
<?php $id=$_REQUEST['id']; ?>
define(['bar/assets/bar-define.php?id=<?php echo $id; ?>&r=<?php echo rand(); ?>'], function(exports){
  return 'foo-<?php echo $id; ?>#' + exports;
});
