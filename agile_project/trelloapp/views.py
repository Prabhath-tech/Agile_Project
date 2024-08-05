from django.shortcuts import render

# Create your views here.

# Create your views here.
def index(request):
    return render(request, 'index.html')
def login_view(request):
    return render(request, 'login.html')
def signup_view(request):
    return render(request, 'signup.html')
def admin_view(request):
    return render(request, 'AdminView.html')