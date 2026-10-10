from django.contrib import admin

from .models import Attraction, Destination, DestinationImage, District, Division, Stay, TransportRoute

admin.site.register(Division)
admin.site.register(District)
admin.site.register(Destination)
admin.site.register(DestinationImage)
admin.site.register(Stay)
admin.site.register(Attraction)
admin.site.register(TransportRoute)
