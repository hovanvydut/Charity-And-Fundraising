$(document).ready(function() {
  (function($) {
    'use strict';

    jQuery.validator.addMethod(
      'answercheck',
      function(value, element) {
        return this.optional(element) || /^\bcat\b$/.test(value);
      },
      'type the correct answer -_-',
    );

    // validate contactForm form
    $(function() {
      $('#contactForm').validate({
        rules: {
          name: {
            required: true,
            minlength: 2,
          },
          subject: {
            required: true,
            minlength: 4,
          },
          info: {
            required: true,
            minlength: 5,
          },
          message: {
            required: true,
            minlength: 20,
          },
        },
        messages: {
          name: {
            required: 'Uhm... chắc bạn quên tên rồi, hãy điền nhé',
            minlength: 'Tên của bạn phải ít nhất 2 kí tự',
          },
          subject: {
            required: 'Uhm... chắc bạn quên điền tiêu đề rồi, hãy điền nhé',
            minlength: 'Tiêu đề phải có ít nhất 4 kí tự',
          },
          info: {
            required:
              'Uhm... chắc bạn quên điền thông tin liên hệ rồi, hãy điền nhé',
            minlength: 'Thông tin phải có ít nhất 5 kí tự',
          },
          message: {
            required: 'Uhm... chắc bạn quên điền tin nhắn rồi, hãy điền nhé',
            minlength:
              'Có ngắn quá không, hãy viết thêm để chúng tôi muốn bạn viết gì (ít nhất 20 kí tự)',
          },
        },
        submitHandler: function(form) {
          $(form).ajaxSubmit({
            type: 'POST',
            data: $(form).serialize(),
            url: '/contact/contact-message',
            success: function(response) {
              swal({
                title: 'Cảm ơn bạn!',
                text: 'Chúng tôi sẽ sớm liên hệ với bạn sớm nhất! <3',
                icon: 'success',
              });

              document.getElementById('contactForm').reset();
            },
            error: function(error) {
              swal({
                title: 'Lỗi!',
                text: error.responseJSON.message,
                icon: 'error',
              });
            },
          });
        },
      });
    });
  })(jQuery);
});
