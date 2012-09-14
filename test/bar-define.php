<?php sleep(rand(0, 2)); ?>
<?php $id=$_REQUEST['id']; ?>
define(function(){
  return 'bar-<?php echo $id; ?>';
});
