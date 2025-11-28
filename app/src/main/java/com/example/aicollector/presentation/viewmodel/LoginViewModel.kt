package com.example.aicollector.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.aicollector.domain.usecase.LoginUseCase
import com.example.aicollector.util.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase
) : ViewModel() {
    
    private val _loginState = MutableStateFlow(LoginState())
    val loginState: StateFlow<LoginState> = _loginState.asStateFlow()
    
    fun login(username: String, password: String) {
        viewModelScope.launch {
            _loginState.value = LoginState(isLoading = true)
            
            when (val result = loginUseCase(username, password)) {
                is NetworkResult.Success -> {
                    _loginState.value = LoginState(isSuccess = true)
                }
                is NetworkResult.Error -> {
                    _loginState.value = LoginState(error = result.message)
                }
                else -> {}
            }
        }
    }
    
    fun clearError() {
        _loginState.value = _loginState.value.copy(error = null)
    }
}
