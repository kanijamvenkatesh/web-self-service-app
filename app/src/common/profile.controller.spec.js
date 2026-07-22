describe('ClientCtrl Unit Tests', function () {
    var $controller, $rootScope, $q, $httpBackend, storageServiceMock, accountServiceMock, authServiceMock;
    var createController;

    beforeEach(module('selfService'));

    beforeEach(inject(function (_$controller_, _$rootScope_, _$q_, _$httpBackend_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $q = _$q_;
        $httpBackend = _$httpBackend_;

        // Mock services
        storageServiceMock = {
            getObject: jasmine.createSpy('getObject').and.callFake(function (key) {
                var deferred = $q.defer();
                if (key === 'user_profile') {
                    deferred.resolve({ userId: 42, username: 'johndoe', _portalRole: 'STAFF', displayName: 'John Doe', email: 'john@example.com', mobileNo: '123456' });
                } else {
                    deferred.resolve(null);
                }
                return deferred.promise;
            }),
            setObject: jasmine.createSpy('setObject').and.callFake(function () {
                return $q.resolve(true);
            })
        };

        accountServiceMock = {
            getClientId: jasmine.createSpy('getClientId').and.callFake(function () {
                var deferred = $q.defer();
                deferred.resolve(101);
                return deferred.promise;
            }),
            getClientImage: jasmine.createSpy('getClientImage').and.callFake(function () {
                var deferred = $q.defer();
                deferred.resolve({ data: 'image_data_uri' });
                return deferred.promise;
            }),
            getClient: jasmine.createSpy('getClient').and.callFake(function () {
                return {
                    get: function () {
                        return {
                            $promise: $q.resolve({
                                firstname: 'John',
                                lastname: 'Doe',
                                email: 'john@example.com',
                                mobileNo: '123456',
                                displayName: 'John Doe'
                            })
                        };
                    }
                };
            })
        };

        authServiceMock = {
            logout: jasmine.createSpy('logout')
        };

        var mdToastMock = {
            show: jasmine.createSpy('show'),
            simple: function () {
                var self = {};
                self.textContent = function () { return self; };
                self.position = function () { return self; };
                self.hideDelay = function () { return self; };
                return self;
            }
        };

        createController = function () {
            return $controller('ClientCtrl', {
                AuthService: authServiceMock,
                AccountService: accountServiceMock,
                storageService: storageServiceMock,
                BASE_URL: 'http://localhost:8080/fineract-provider/api/v1',
                $q: $q,
                $mdToast: mdToastMock
            });
        };
    }));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should initialize with correct default state for Staff', function () {
        var vm = createController();
        $rootScope.$apply();

        expect(vm.editMode).toBe(false);
        expect(vm.currentUser.username).toBe('johndoe');
        expect(vm.profile.displayName).toBe('John Doe');
    });

    it('should toggle edit mode correctly', function () {
        var vm = createController();
        expect(vm.editMode).toBe(false);
        vm.toggleEdit();
        expect(vm.editMode).toBe(true);
        vm.toggleEdit();
        expect(vm.editMode).toBe(false);
    });

    it('should call AuthService logout when logout is triggered', function () {
        var vm = createController();
        vm.logout();
        expect(authServiceMock.logout).toHaveBeenCalled();
    });

    it('should perform PUT request and update profile on saveProfile() for Staff', function () {
        var vm = createController();
        $rootScope.$apply();

        vm.profile.displayName = 'Updated Name';
        vm.profile.firstname = 'Updated';
        vm.profile.lastname = 'Name';
        vm.profile.email = 'updated@example.com';

        var expectedUrl = 'http://localhost:8080/fineract-provider/api/v1/users/42';
        var expectedPayload = {
            username: 'johndoe',
            firstname: 'Updated',
            lastname: 'Name',
            email: 'updated@example.com'
        };
        var mockResponse = {
            username: 'johndoe',
            firstname: 'Updated',
            lastname: 'Name',
            email: 'updated@example.com',
            userId: 42
        };

        $httpBackend.expectPUT(expectedUrl, expectedPayload).respond(200, mockResponse);

        vm.saveProfile();
        $httpBackend.flush();

        expect(vm.editMode).toBe(false);
        expect(vm.profile.firstname).toBe('Updated');
        expect(storageServiceMock.setObject).toHaveBeenCalledWith('user_profile', mockResponse);
    });
});
