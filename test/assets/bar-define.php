<?php sleep(rand(0, 1)); ?>
<?php $id=$_REQUEST['id']; ?>
define(function(){
  return 'bar-<?php echo $id; ?>';
});
