function throttle_percentage(pwm){
  var min_throttle = 1025;
  var max_throttle = 1850;

  var delta_pwm = pwm - min_throttle;

  var delta_max_throttle = max_throttle - min_throttle;

  return ((delta_pwm / delta_max_throttle) * 100).toFixed(2);
}
