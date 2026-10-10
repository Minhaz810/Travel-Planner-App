from django.urls import path

from .views import (
    DestinationAttractionListView,
    DestinationDetailView,
    DestinationListView,
    DestinationStayListView,
    DistrictListView,
    DivisionListView,
    TransportRouteListView,
)

# The fixed paths must come before `<slug:slug>/` so they aren't read as destination slugs.
urlpatterns = [
    path('', DestinationListView.as_view(), name='destination-list'),
    path('divisions/', DivisionListView.as_view(), name='division-list'),
    path('districts/', DistrictListView.as_view(), name='district-list'),
    path('routes/', TransportRouteListView.as_view(), name='route-list'),
    path('<slug:slug>/', DestinationDetailView.as_view(), name='destination-detail'),
    path('<slug:slug>/stays/', DestinationStayListView.as_view(), name='destination-stays'),
    path('<slug:slug>/attractions/', DestinationAttractionListView.as_view(), name='destination-attractions'),
]
