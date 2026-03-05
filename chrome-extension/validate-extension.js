// 验证Chrome扩展文件编码和配置
// 在扩展的背景页控制台运行此脚本

function validateExtensionFiles() {
    console.log('🔧 Chrome扩展文件验证工具');
    console.log('======================================');
    
    const filesToCheck = [
        'manifest.json',
        'config.js',
        'content.js',
        'background.js',
        'popup.js',
        'popup.html'
    ];
    
    let issuesFound = [];
    
    // 检查文件内容
    filesToCheck.forEach(fileName => {
        console.log(`\n检查文件: ${fileName}`);
        
        try {
            // 尝试读取文件内容
            fetch(chrome.runtime.getURL(fileName))
                .then(response => response.text())
                .then(content => {
                    // 检查是否有奇怪的字符
                    const hasInvalidChars = /[^\x00-\x7F\n\r\t ]/.test(content);
                    
                    if (hasInvalidChars) {
                        console.log(`  ❌ 发现非ASCII字符`);
                        issuesFound.push(`${fileName}: 包含非ASCII字符`);
                    } else {
                        console.log(`  ✅ 文件内容正常`);
                    }
                    
                    // 检查特定文件的内容
                    if (fileName === 'manifest.json') {
                        try {
                            const manifest = JSON.parse(content);
                            
                            // 检查必需字段
                            if (!manifest.manifest_version) {
                                issuesFound.push('manifest.json: 缺少manifest_version');
                            }
                            if (!manifest.name) {
                                issuesFound.push('manifest.json: 缺少name');
                            }
                            if (!manifest.version) {
                                issuesFound.push('manifest.json: 缺少version');
                            }
                            
                            // 检查Railway API地址
                            const hasRailwayUrl = manifest.host_permissions && 
                                manifest.host_permissions.some(permission => 
                                    permission.includes('ai-bookmark-production-5ecc.up.railway.app')
                                );
                            
                            if (hasRailwayUrl) {
                                console.log('  ✅ Railway API地址已配置');
                            } else {
                                console.log('  ❌ Railway API地址未配置');
                                issuesFound.push('manifest.json: 未配置Railway API地址');
                            }
                            
                            console.log(`  ✅ 清单文件格式正确`);
                        } catch (e) {
                            console.log(`  ❌ JSON解析失败: ${e.message}`);
                            issuesFound.push(`manifest.json: JSON解析错误 - ${e.message}`);
                        }
                    }
                    
                    if (fileName === 'config.js') {
                        // 检查环境配置
                        if (content.includes('CURRENT_ENV = \'production\'')) {
                            console.log('  ✅ 生产环境已设置');
                        } else {
                            console.log('  ❌ 生产环境未设置');
                            issuesFound.push('config.js: 未设置为生产环境');
                        }
                        
                        if (content.includes('ai-bookmark-production-5ecc.up.railway.app')) {
                            console.log('  ✅ Railway API地址已配置');
                        } else {
                            console.log('  ❌ Railway API地址未配置');
                            issuesFound.push('config.js: 未配置Railway API地址');
                        }
                    }
                    
                    if (fileName === 'content.js' || fileName === 'background.js') {
                        // 检查API地址引用
                        if (content.includes('ai-bookmark-production-5ecc.up.railway.app')) {
                            console.log('  ✅ Railway API地址已引用');
                        } else {
                            console.log('  ⚠️  未发现Railway API地址引用');
                        }
                    }
                })
                .catch(error => {
                    console.log(`  ❌ 无法读取文件: ${error.message}`);
                    issuesFound.push(`${fileName}: 无法读取 - ${error.message}`);
                });
                
        } catch (error) {
            console.log(`  ❌ 文件检查失败: ${error.message}`);
            issuesFound.push(`${fileName}: 检查失败 - ${error.message}`);
        }
    });
    
    // 延迟显示最终结果
    setTimeout(() => {
        console.log('\n======================================');
        console.log('📊 验证结果总结');
        console.log('======================================');
        
        if (issuesFound.length === 0) {
            console.log('🎉 所有文件检查通过！');
            console.log('✅ 扩展文件编码正常');
            console.log('✅ Railway API地址已正确配置');
            console.log('✅ 可以安全重新加载扩展');
        } else {
            console.log(`⚠️  发现 ${issuesFound.length} 个问题:`);
            issuesFound.forEach(issue => {
                console.log(`  - ${issue}`);
            });
            console.log('\n🔧 建议操作:');
            console.log('1. 重新创建有问题的文件');
            console.log('2. 检查文件编码（确保UTF-8）');
            console.log('3. 验证JSON格式');
        }
        
        console.log('\n🔗 相关链接:');
        console.log('Railway控制台: https://railway.app/dashboard');
        console.log('API地址: https://ai-bookmark-production-5ecc.up.railway.app');
        console.log('扩展目录: chrome-extension/');
        
    }, 2000);
}

// 运行验证
console.log('正在验证Chrome扩展文件...');
validateExtensionFiles();