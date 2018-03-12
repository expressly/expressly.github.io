$(function() {
    function position() {
        $('.ad-placement').each(function() {
            var position = $($(this).data('position')).first();
            if (position.next().get() !== this) {
                $(this).insertAfter(position);
            }
        });
    }

    $('.card-sorter').change(function() { setTimeout(position, 10); });
    $('.card-filter').change(function() { setTimeout(position, 10); });
    position();
});